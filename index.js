const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// https://www.aloktools.com/



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tzls3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection = client.db('daisyTools').collection('product');
        const reviewCollection = client.db('daisyTools').collection('reviews');
        const purchaseCollection = client.db('daisyTools').collection('purchase');

        app.get('/products', async (req, res)=>{
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        app.post('/products', async (req, res)=>{ 
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
          });

        app.get('/reviews', async (req, res)=>{
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        })

        app.post('/reviews', async (req, res)=>{ 
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.post('/purchase', async (req, res)=>{
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase);
            res.send(result);
        })





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