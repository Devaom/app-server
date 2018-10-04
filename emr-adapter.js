var AWS = require('aws-sdk');
var emr = new AWS.EMR({region: 'ap-northeast-2'});

function addJobFlowStepsPromise(cluster_id, argv) {
	return new Promise(function(resolve, reject) {
		var params = {
			JobFlowId: cluster_id, // required
			Steps: [ // required
				{
					HadoopJarStep: { // required
						Jar: 'command-runner.jar', // required
						Args: [
							'spark-submit',
							'--deploy-mode', 'cluster',
							'--master', 'yarn',
							'--conf', 'spark.yarn.submit.waitAppCompletion=false',
							'--py-files', 's3://inked-emr-app/modules.zip',
							's3://inked-emr-app/main.py',
							argv
						],
						/*
						MainClass: ,
						Properties: [
							{
								Key: 'Type',
								Value: 'spark'
							}
						]
						*/
					},
					Name: 'SparkPiApp', // required
					ActionOnFailure: 'CONTINUE'
				}
			],
		}
		emr.addJobFlowSteps(params, function(err, data) {
			if(err) {
				console.log('an error occured while adding a job to spark: ' + String(err));
				console.log(err.stack);
				reject(err);
			} else {
				console.log('adding a job to spark complete: ' + String(data));
				resolve(data);
			}
		});
	});
}

exports.addJobFlowStepsPromise = addJobFlowStepsPromise;

//var cluster_id = 'j-12KBV0SP33U4I';
//var argv = '실행 결과를 알고싶음';

/*
addJobFlowStepsPromise(cluster_id, argv).then(function(data){
	console.log('처리한 결과' + String(data));
});
*/
