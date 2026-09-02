import app from "./app.js";

const PORT = 5001;

app.listen(PORT, ()=>{
    console.log("app is listening at port:", PORT);
})