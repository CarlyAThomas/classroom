import { useEffect, useState } from 'react';
import { fetchFromFCC } from '../util/fcc_proper';


export default function HelloComponent() {
 const [data, setData] = useState(null);
 const [error, setError] = useState(null);
 const [loading, setLoading] = useState(true);


 useEffect(() => {
   async function fetchData() {
     try {
       const result = await fetchFromFCC({
          emails: ['foo@bar.com'],
       });
       setData(result);
     } catch (err) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   }


   fetchData();
 }, []);


 if (loading) return <div>Loading...</div>;
 if (error) return <div>Error: {error}</div>;
  return (
   <div>
     <h2>Response from freeCodeCamp API:</h2>
     <pre>{JSON.stringify(data, null, 2)}</pre>
   </div>
 );
}
