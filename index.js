const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// https://www.aloktools.com/


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tzls3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection = client.db('daisyTools').collection('product');

        app.get('/products', async (req, res)=>{
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        app.post('/products', async (req, res)=>{ 
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
          });




    } finally{

    }
}

run().catch(console.dir);


app.get('/', (req, res)=>{
 res.send('Server connected with client');
});

app.listen(port, ()=>{
    console.log('Local server port is ', port);
})