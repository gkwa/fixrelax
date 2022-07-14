import { Stack, StackProps } from 'aws-cdk-lib';
import { CfnInstanceProfile, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnOutput, Fn } from 'aws-cdk-lib';
import { CfnLaunchTemplate, CfnSecurityGroup, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FixrelaxStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    // Web AMI
    const imageId = 'ami-<xxxxxxxxx>'

    // Role for EC2 Instance Profile
    const role = new Role(this, 'webRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for web instances',
    });

    role.addToPolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${bucket.bucketArn}/*`]
    }))

    const webInstanceProfile = new CfnInstanceProfile(this, 'webInstanceProfile', {
      roles: [role.roleName],
      instanceProfileName: 'webInstanceProfile',
    });

    // User Data script to copy DB endpoint to web folder
    const userData = Fn.base64('#!/usr/bin/env bash \n sudo aws s3 cp s3://assets-rds-endpoint-pm-323912/db.txt /var/www/html/db.txt')

    // Launch Template
    const launchTemplateData: CfnLaunchTemplate.LaunchTemplateDataProperty = {
      imageId, // Amazon Linux 2 with Apache, PHP and the website 
      instanceType: 't2.micro',
      iamInstanceProfile: {
        arn: webInstanceProfile.attrArn
      },
      networkInterfaces: [{
        interfaceType: 'efa',
        associatePublicIpAddress: false,
        deviceIndex: 0,
        groups: [websg.attrGroupId],
        subnetId: subnets.webA.attrSubnetId,
      }],
      keyName: 'mpkey',
      userData
    }

    const launchTemplate = new CfnLaunchTemplate(this, 'launch-template', {
      launchTemplateData,
      launchTemplateName: 'launch-template'
    })




  }
}
