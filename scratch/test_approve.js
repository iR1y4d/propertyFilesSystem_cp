require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/dotenv').config({ path: 'c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env' });
const requestService = require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/requestService');

async function main() {
  try {
    console.log('Attempting to approve request_id 1 with adminUserId 1...');
    const res = await requestService.approveRequest(1, 1);
    console.log('Success:', res);
  } catch (err) {
    console.error('Approve failed with error:', err);
  }
}

main();
