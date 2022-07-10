const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tzls3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'UnAuthorized access'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'});
        }
        req.decoded = decoded;
        next();
    });
}

async function run(){
    try{
        await client.connect();
        const productCollection = client.db('daisyTools').collection('product');
        const reviewCollection = client.db('daisyTools').collection('reviews');
        const purchaseCollection = client.db('daisyTools').collection('purchase');
        const profileCollection = client.db('daisyTools').collection('profile');
        const userCollection = client.db('daisyTools').collection('users');
        const inboxCollection = client.db('daisyTools').collection('inbox');
        const paymentCollection = client.db('daisyTools').collection('payment');



        app.get('/admin/:email', verifyJWT, async(req, res)=>{
            const email = req.params.email;
            const user = await userCollection.findOne({email:email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin});
        })

        app.put('/users/admin/:email', verifyJWT, async (req, res)=>{
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email:requester});
            if(requesterAccount.role === 'admin'){
                const filter = {email:email};
            const updateDoc = {
                $set: {role:'admin'},
            }
            const users = await userCollection.updateOne(filter, updateDoc);
            res.send(users);
            } else{
                return res.status(403).send({message: 'forbidden access'})
            }
            
        })

        app.put('/users/:email', async (req, res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email:email};
            const options = {upsert:true};
            const updateDoc = {
                $set: user,
            }
            const users = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
            res.send({users, token});
        })

        app.get('/users/:email', async (req, res)=>{
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/users', verifyJWT, async (req, res)=>{
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/inbox', async(req, res)=>{
            const result = await inboxCollection.find().toArray();
            res.send(result);
        })

        app.post('/inbox', async (req, res)=>{ 
            const inbox = req.body;
            const result = await inboxCollection.insertOne(inbox);
            res.send(result);
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

          app.delete('/products/:id', async (req, res)=>{
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await productCollection.deleteOne(filter);
            res.send(result);
          });

        app.get('/myProfile/:email', async (req, res)=>{
            const email = req.params.email;
            const profile = await profileCollection.find(email).toArray();
            res.send(profile);
        })

        app.post('/myProfile', async (req, res)=>{ 
            const profile = req.body;
            const result = await profileCollection.insertOne(profile);
            res.send(result);
          });

        app.patch('/myProfile/:id', async(req, res)=>{
            const id = req.params.id;
            const updatedId = req.body;
            const filter = {_id:ObjectId(id)};
            const options = {upsert: true};
            const profileUpdate = {
                $set:{
                    name: updatedId.name,
                    email:updatedId.email,
                    phone:updatedId.phone,
                    description:updatedId.description,
                    address:updatedId.address,
                    experience:updatedId.experience,
                    skills:updatedId.skills,
                    education:updatedId.education,
                    img:updatedId.img,
                }
            }
            const result = await profileCollection.updateOne(filter, profileUpdate, options);
            res.send(result);
        })

        app.get('/reviews', async (req, res)=>{
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        });

        app.post('/reviews', async (req, res)=>{ 
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.get('/purchase', verifyJWT, async (req, res)=>{
            const customer = req.query.customer;
            const decodedEmail = req.decoded.email;
            if(customer === decodedEmail){
                const query = {customer:customer};
            const purchase = await purchaseCollection.find(query).toArray();
           return res.send(purchase);
            }
             else{
                return res.status(403).send({message: 'forbidden access'})
             }
            
        });

        app.post('/purchase', async (req, res)=>{
            const purchase = req.body;
            const query = {name:purchase.name, date:purchase.date, customer:purchase.customer};
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
          });

          app.delete('/purchase/:id', async (req, res)=>{
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await purchaseCollection.deleteOne(filter);
            res.send(result);
          });

          app.post('/create-payment-intent', async (req, res)=>{
            const purchase = req.body;
            const price = purchase.price;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount:amount,
              currency:'usd',
              payment_method_types:['card']
            });
      
            res.send({
              clientSecret:paymentIntent.client_secret,
            })
      
          });

          app.patch('/purchase/:id', async (req, res)=>{
            const id = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
              $set: {
                paid:true,
                transactionId:payment.transactionId
              }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatePurchase = await purchaseCollection.updateOne(filter, updatedDoc);
            res.send(updatePurchase);
          });


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