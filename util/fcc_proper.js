import { getSession } from "next-auth/react";
import jwt from "jsonwebtoken";


export async function fetchFromFCC(options = {}) {
 const session = await getSession();
  if (!session) {
   throw new Error("User not authenticated");
 }
  // Call our own API endpoint instead of external service directly
 const url = `/api/fcc-proxy`;
  const headers = {
   'Content-Type': 'application/json',
 };
  console.log("In fetchFromFCC ******************************")
 console.log('accessToken', session.accessToken);
 console.log('ttl', session.ttl);
 console.log('created', session.created);




 // Send the request to our server-side API route
 const response = await fetch(url, {
   method: 'POST',
   headers,
   body: JSON.stringify({
     accessToken: session.accessToken,
     ttl: session.ttl,
     created: session.created,
     options: options
   }),
 });
  if (!response.ok) {
   throw new Error(`API request failed with status ${response.status}`);
 }
  return response.json();
}


const jwtSecret = process.env.JWT_SECRET;


export function signAccessToken(accessTokenObj) {
   const signedToken = jwt.sign(accessTokenObj, jwtSecret, { algorithm: 'HS256' });


   return signedToken;
}
