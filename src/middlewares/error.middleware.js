import { responseError } from "../utils/error.js"

 export const errorMiddleware = (err,req,res,next) => {
    if(err instanceof responseError){
        return res.status(err.status).json({
            msg : err.message,
            stack : err.stack
        })
    }

    if (err.isAxiosError) {
        console.log(err.response.data.error);
        
        if(err.response.data.error.code === 100){
            return res.status(500).json({
                msg : `${err.response.data.error.message} : ${err.response.data.error.error_user_msg}`,
                stack : err.stack
            })
        }
        return res.status(500).json({
            msg : err.response.data.error.message,
            stack : err.stack
        })
    }
    return res.status(500).json({
        msg : err.message,
        stack : err.stack
    })
}