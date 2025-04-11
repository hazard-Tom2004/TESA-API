import express, {json} from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoute from "./routes/routes.js"


dotenv.config();

const app = express();
connectDB();

//middlewares
app.use(json());
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/tesa/auth", authRoute);


const port = process.env.PORT || 3008

connectDB()
app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
});