const mongoose=require('mongoose');
const { setServers } =require('node:dns/promises');

async function main( ) {
    setServers(['8.8.8.8', '8.8.4.4']);    
    await mongoose.connect(process.env.DB_CONNECT_STRING,{
          family: 4
    });
   
    
}
module.exports=main;