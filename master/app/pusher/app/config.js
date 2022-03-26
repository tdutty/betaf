const DEFAULT_ENDPOINT = '/pusher/auth';
const {PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET, PUSHER_CLUSTER, CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET,CLOUDINARY_CLOUD_NAME, PORT, DEBUG, SENDGRID_API_KEY} = process.env;
const ENDPOINT = process.env.ENDPOINT || DEFAULT_ENDPOINT;
const config = {PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET, PUSHER_CLUSTER, CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET,CLOUDINARY_CLOUD_NAME, PORT, DEBUG, ENDPOINT, SENDGRID_API_KEY};

const requiredKeys = ['PUSHER_APP_ID', 'PUSHER_APP_KEY', 'PUSHER_APP_SECRET', 'PUSHER_CLUSTER'];
requiredKeys.forEach(key => {
  if (config[key]) return;
  throw new Error(getMissingKeyErrorString(key));
});


const CloudKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']
CloudKeys.forEach(key => {
  if(config[key]) return; 
  throw new Error(getMissingKeyErrorString(key))
})


module.exports = config;

function getMissingKeyErrorString(keyName) {
  const errorStr =
    `Unable to find environment variable: ${keyName}! ` +
    `Did you remember to set the ${keyName} value in your .env file?`;
  return errorStr;
}
