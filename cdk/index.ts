import { Construct } from 'constructs';
import {
  App,
  Fn,
  NestedStack,
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_iam as iam,
} from 'aws-cdk-lib';

import { readFileSync } from 'fs';
const bootstrap: string = readFileSync('./userdata/bootstrap.sh', 'utf8');

const app = new App();

class HashcatNetworkStack extends NestedStack {
  vpc: ec2.IVpc;
  constructor(scope: Construct, props: StackProps) {
    super(scope, 'hashcat-vpc-stack', props);

    this.vpc = new ec2.Vpc(this, 'TempVpc', {
      maxAzs: 99,
      natGateways: 1
    });
  }
}

class TempHashcatStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const nwStack = new HashcatNetworkStack(this, {});

    const userData = ec2.UserData.forLinux();
    userData.addCommands(bootstrap);
    userData.addCommands(
      `curl -X POST -H "Accept: application/vnd.github.v3+json" ` +
      `-H "Authorization: token ${process.env.GH_TOKEN}" ` +
      `https://api.github.com/repos/javydekoning/aws-hashcat/dispatches -d '{"event_type":"destroy"}' ` +
      `2>&1 || true`,
      `shutdown 0`
    );

    const role = new iam.Role(this, 'HashCatEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        effect: iam.Effect.ALLOW,
        resources: [
          `arn:aws:ssm:us-east-1:${Stack.of(this).account}:parameter/gitkey`,
        ],
      })
    );

    //g5.xlarge = 1 x A10G
    //g5.12xlarge = 4x A10G
    //g4dn.xlarge = 1 x T4
    //p3.2xlarge = 1 x V100
    //p4d.24xlarge = 8 x A100
    //p4de.24xlarge = 8 x A100 (double mem)
    //https://aws.amazon.com/ec2/instance-types/
    const instanceType = process.env.EC2_INSTANCE_TYPE ?? 'p4d.24xlarge';

    const image = new ec2.LookupMachineImage({
      windows: false,
      filters: { name: ['*Deep Learning AMI GPU CUDA 11*Ubuntu*'] },
      owners: ['amazon'],
      name: 'AWS Deep Learning AMI GPU CUDA 11*',
    })

    const lt = new ec2.LaunchTemplate(this, 'lt', {
      instanceInitiatedShutdownBehavior: ec2.InstanceInitiatedShutdownBehavior.TERMINATE,
      instanceType: new ec2.InstanceType(instanceType),
      role,
      machineImage: image,
      userData,
      securityGroup: new ec2.SecurityGroup(this, 'sg', { vpc: nwStack.vpc, allowAllOutbound: true })
    })

    new ec2.CfnEC2Fleet(this, 'fleet', {
      targetCapacitySpecification: {
        totalTargetCapacity: 1,
        defaultTargetCapacityType: 'on-demand',
      },
      type: 'request',
      launchTemplateConfigs: [{
        launchTemplateSpecification: {
          launchTemplateId: lt.launchTemplateId,
          version: '$Latest'
        },
        overrides: [{
          instanceType: instanceType,
          subnetId: nwStack.vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
          }).subnetIds.join(',')
        }]
      }],
    })
  }
}
new TempHashcatStack(app, 'TempHashCatStack', {
  env: {
    region: process.env.AWS_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
