#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { readFileSync } from 'fs';
const bootstrap: string = readFileSync('./userdata/bootstrap.sh', 'utf8');


const app = new cdk.App();

class TempHashcatStack extends cdk.Stack{
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const vpc = new ec2.Vpc(this, 'TempVpc', {
      maxAzs: 1 
    })

    const userData = ec2.UserData.forLinux()
    userData.addCommands(bootstrap)

    const role = new iam.Role(this, 'HashCatEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    })
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))
    role.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:ssm:us-east-1:${cdk.Stack.of(this).account}:parameter/gitkey`]
    }))

    const instance = new ec2.Instance(this, 'Instance', {
      instanceType: new ec2.InstanceType('g4dn.12xlarge'),
      vpc,
      role,
      machineImage: new ec2.LookupMachineImage({
        name: 'AWS Deep Learning AMI GPU CUDA 11.3 (Amazon Linux 2)',
        windows: false,
        filters: {name: ['*Deep Learning AMI GPU CUDA 11.3*Amazon Linux 2*']},
        owners: ['amazon']
      }),
      allowAllOutbound: true,
      userData,
    })

    const cfnInstance = instance.node.defaultChild as ec2.CfnInstance;
    cfnInstance.addPropertyOverride('InstanceInitiatedShutdownBehavior', 'terminate');
  }
}
new TempHashcatStack(app, 'TempHashCatStack', {
  env: {region: process.env.AWS_DEFAULT_REGION , account: process.env.CDK_DEFAULT_ACCOUNT}
});
