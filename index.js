const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// https://www.aloktools.com/

// https://www.youtube.com/watch?v=1NWBO8L81J8
// https://www.youtube.com/watch?v=eDw46GYAIDQ
// https://with.zonayed.me/



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tzls3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const productCollection = client.db('daisyTools').collection('product');
        const reviewCollection = client.db('daisyTools').collection('reviews');
        const purchaseCollection = client.db('daisyTools').collection('purchase');
        const profileCollection = client.db('daisyTools').collection('profile');
        const userCollection = client.db('daisyTools').collection('users');

        app.put('/users/:email', async (req, res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email:email};
            const options = {upsert:true};
            const updateDoc = {
                $set: user,
            }
            const users = await userCollection.updateOne(filter, updateDoc, options);
            res.send(users);
        })

        app.get('/users/:email', async (req, res)=>{
            const users = await userCollection.find().toArray();
            res.send(users);
        });
        
        app.get('/products', async (req, res)=>{
            const products = await productCollection.find().toArray();
            res.send(products);
        });

        app.get('/products/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const product = await productCollection.findOne(query);
            res.send(product);
          });

        app.put('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const updatePurchase  = req.body;
            const filter = {_id:ObjectId(id)};
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    quantity:updatePurchase.quantity,
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.post('/products', async (req, res)=>{ 
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
          });

        app.get('/myProfile', async (req, res)=>{
            const profile = await profileCollection.find().toArray();
            res.send(profile);
        })

        app.post('/myProfile', async (req, res)=>{ 
            const profile = req.body;
            const result = await profileCollection.insertOne(profile);
            res.send(result);
          });

        app.get('/reviews', async (req, res)=>{
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        });

        app.post('/reviews', async (req, res)=>{ 
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // app.get('/purchase', async (req, res)=>{
        //     const reviews = await purchaseCollection.find().toArray();
        //     res.send(reviews);
        // });

        app.get('/purchase', async (req, res)=>{
            const customer = req.query.customer;
            const query = {customer:customer};
            const purchase = await purchaseCollection.find(query).toArray();
            res.send(purchase);
        });

        app.post('/purchase', async (req, res)=>{
            const purchase = req.body;
            const query = {productName:purchase.productName, date:purchase.date, customer:purchase.customer};
            const exists = await purchaseCollection.findOne(query);
            if(exists){
                return res.send({success:false, purchase:exists})
            } 
            const result = await purchaseCollection.insertOne(purchase);
            return res.send({success:true, result});
        });

        app.get('/purchase/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const purchase = await purchaseCollection.findOne(query);
            res.send(purchase);
          })


        app.get('/available', async (req, res)=>{
            const date = req.query.date;
            const products = await productCollection.find().toArray();
            const query = {date:date};
            const purchases = await purchaseCollection.find(query).toArray();

            const productSell = products.quantity.filter(sell => sell.productName !== purchases.quantity);
            // products.forEach(product =>{
            //     const productSell = purchases.filter(sell => sell.productName === product.name);
            //     const purchased = productSell.map(item => item.purchaseValue);
            //     const available = product.quantity.filter(sell => !purchased.includes(sell));
            //     product.purchased = productSell.map(item => item.purchaseValue);
            //     product.available = available;
            // })

            res.send(productSell);
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