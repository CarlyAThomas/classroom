import Head from 'next/head';
import Navbar from '../components/navbar';
import HelloComponent from '../components/hello';
import { getSession } from 'next-auth/react';


export default function HelloPage({ userSession }) {
 return (
   <>
     <Head>
       <title>Hello API Test - freeCodeCamp Classroom</title>
       <meta name="description" content="Testing the freeCodeCamp API connection" />
     </Head>
     <Navbar>
       <div className='border-solid border-2 pl-4 pr-4'>
         <a href='/classes'>Classes</a>
       </div>
       <div className='border-solid border-2 pl-4 pr-4'>
         <a href='/'>Menu</a>
       </div>
     </Navbar>
    
     <div className="container mx-auto px-4 py-8">
       <h1 className="text-3xl font-bold mb-6">freeCodeCamp API Test</h1>
       <HelloComponent />
     </div>
   </>
 );
}


// Optional: Get the session on the server side
export async function getServerSideProps(context) {
 const userSession = await getSession(context);
  // If you want to require authentication for this page
 if (!userSession) {
   return {
     redirect: {
       destination: '/api/auth/signin',
       permanent: false,
     },
   };
 }
  return {
   props: { userSession },
 };
}
