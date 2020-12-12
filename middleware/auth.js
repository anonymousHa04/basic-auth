const jwt = require('jsonwebtoken')
const User = require('../db/db')

const auth = async (req,res,next) => {
    try {
        const token = req.cookies.jwt;
        const decoded = jwt.verify(token, process.env.SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
            throw new Error()
        }

        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
}


module.exports = auth