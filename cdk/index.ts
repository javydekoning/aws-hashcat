import { Construct } from 'constructs';
import {
  App,
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_iam as iam,
} from 'aws-cdk-lib';

import { readFileSync } from 'fs';
const bootstrap: string = readFileSync('./userdata/bootstrap.sh', 'utf8');

const app = new App();

class TempHashcatStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'TempVpc', {
      maxAzs: 1,
    });

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
    //g4dn.xlarge = 1 x T4
    //p3.2xlarge = 1 x V100
    //p4d.24xlarge = 8 x A100
    const instanceType = process.env.EC2_INSTANCE_TYPE ?? 'g4dn.xlarge';
    const instance = new ec2.Instance(this, 'Instance', {
      instanceType: new ec2.InstanceType(instanceType),
      vpc,
      role,
      machineImage: new ec2.LookupMachineImage({
        //name: 'AWS Deep Learning AMI GPU CUDA 11.5 or later',
        windows: false,
        filters: { name: ['*Deep Learning AMI GPU CUDA 11*Ubuntu*'] },
        owners: ['amazon'],
        name: 'AWS Deep Learning AMI GPU CUDA 11*',
      }),
      allowAllOutbound: true,
      userData,
    });

    const cfnInstance = instance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.addPropertyOverride(
      'InstanceInitiatedShutdownBehavior',
      'terminate'
    );
  }
}
new TempHashcatStack(app, 'TempHashCatStack', {
  env: {
    region: process.env.AWS_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
