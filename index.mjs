import { config } from "dotenv";
import express from "express";
import router from "./router.mjs" ;
import cors from "cors";
import mongoose from "mongoose";

// Init dotenv
config() ;

// Express setup + middleware stack
const app = express() ;

// CORS
app.use(cors());

// Other middleware
app.use(express.json()) ;
app.use(express.urlencoded({ extended: false })) ;

// Routes
app.use(router) ;

// Connect to DB
mongoose.connect(process.env.DBURI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}) ;

// Database event handling
const db = mongoose.connection ;
db.on('error', console.error.bind(console, 'connection error:')) ; // Log connection errors
db.once('open', () => console.log("Database connected")) ; // Open the connection

// Listen for connections
const port = process.env.PORT || 3005 ;
app.listen(port, () => {
	console.log(`My app is listening on port: ${port}`) ;
 }) ;