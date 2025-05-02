// Import the signAccessToken function
import { signAccessToken } from '../../util/fcc_proper'; // Adjust the path based on where this function is defined


export default async function handler(req, res) {
 if (req.method !== 'POST') {
   return res.status(405).json({ error: 'Method not allowed' });
 }


 /*
 { "accessToken": {
       "accessToken": 'eyJfj3234jfjsf..',
       "created": '2025-04-21T15:04:05.000Z',
       "ttl": 77760000000 }
   }
 */


 try {


   console.log("In fcc-proxy ******************************")
   console.log('req.body', req.body);
   const { accessToken, options, ttl, created } = req.body;


 


   console.log('accessToken', accessToken);
   if (!accessToken) {
       console.log("Unauthorized!")
     return res.status(401).json({ error: 'Unauthorized' });
   }
  
   let accessTokenObj = {
       accessToken: {
         accessToken: accessToken,
         id: accessToken,
         ttl: ttl,
         created: created
       }
   }




   // The actual URL to FCC's API
   const fccUrl = 'http://localhost:3000/api/hello';
  
   // Set up headers for the server-to-server request
   console.log("Signing access token ******************************")
   console.log('accessTokenObj', accessTokenObj);
   const signedToken = signAccessToken(accessTokenObj);
   console.log('signedToken', signedToken);
  
   const headers = {
     ...options?.headers,
     'Content-Type': 'application/json',
     'Cookie': `jwt_access_token=${signedToken}`
   };
  
   console.log("headers", headers);




   // Make the request from the server
   console.log("About to fetch from FCC ");
   const fccResponse = await fetch(fccUrl, {
     ...options,
     headers,
     credentials: 'include',
   });
  
   // Get the response data
   const data = await fccResponse.json();
  
   // Return the data to the client
   console.log("Fetched from FCC ******************************")
   console.log('data', data);
   return res.status(fccResponse.status).json(data);
  
 } catch (error) {
   console.error('Error proxying request to FCC:', error);
   return res.status(500).json({ error: 'Failed to fetch from FCC' });
 }
}
