import express from "express";
import cors from "cors"

const corsOptions={
    origin:"*",
    methods: "*",
    allowedHeaders: "*"
}
const setMiddleware=(app)=>{
   app.use(express.json())
   app.use(cors(corsOptions))
}

export default setMiddleware