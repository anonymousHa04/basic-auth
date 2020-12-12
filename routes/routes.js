const express = require('express');
const router = express.Router();
const User = require('../db/db');
const auth = require('../middleware/auth');
const { confirmEmail, resendLink } = require('../middleware/email');
// const authRole = require('../middleware/authRole')
const mailgun = require("mailgun-js");
const DOMAIN = process.env.DOMAIN;
// console.log(process.env.APIKEY, DOMAIN)
const mg = mailgun({ apiKey: process.env.APIKEY, domain: DOMAIN });


router.get('/', auth,async (req, res) => {
    // res.send('bla ba bla');
    const user = await User.find({});
    res.send(user)
});


const maxAge = 3 * 24 * 60 * 60;
const maxAge1 = 1;

router.post('/', async (req, res) => {
    // console.log(req.body)
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.activationAuthToken()
        // console.log(token)

        //send Email
        const data = {
            from: 'Excited User <me@samples.mailgun.org>',
            to: `${req.body.email}`,
            subject: 'Activate Your',
            text: 'Hello ' + req.body.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + user.email + '\/' + token + '\n\nThank You!\n'
        };
        mg.messages().send(data, function (error, body) {
            if (body !== undefined) {
                console.log(body);
            } else {
                console.log(error)
            }
        });

        res.status(201).send({msg: `We have sent a MAGIC link to activate your account.If U didn't found it check your spam folder or click on resend link.`, user: user})


    } catch (e) {
        console.log(e.keyPattern.email) 
        if (e.keyPattern.email === 1 ){
            res.status(400).send({msg: `Email Already Taken`})
        }
        res.status(400).send(e)
    }
});

// send activation link
router.get('/confirmation/:email/:token', confirmEmail);

router.post('/resend', async (req, res)=> {
    try {
        const data = {
            from: 'Excited User <me@samples.mailgun.org>',
            to: `${req.body.email}`,
            subject: 'Activate Your',
            text: 'Hello ' + req.body.name + ',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + user.email + '\/' + token + '\n\nThank You!\n'
        };
        mg.messages().send(data, function (error, body) {
            if (body !== undefined) {
                console.log(body);
            } else {
                console.log(error)
            }
        });

        res.status(201).send({msg: `We have sent a MAGIC link to activate your account.If U didn't found it check your spam folder or click on resend link.`, user: user})

    } catch (error) {
        res.status(500).send({msg:'Technical Issue!, Please click on resend for verify your Email.'});
    }
});

// login parts

router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        //check if user is verfied or not
        if (user.isVerified === false) {
            res.status(401).send('Please verify ur email')
        }else {
            const token = await user.generateAuthToken()
            res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
            // res.status(201).send({ user })
            res.status(201).send({msg:`You are logged in.` , user: user})
        }

    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})


router.post('/logout', auth, async (req, res) => {
    try {
        //filter the token that is present in users.token array
        // console.log(req.headers.cookie)
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.cookie('jwt', '1', { httpOnly: true, maxAge: maxAge1 });
        res.send('logged out')
    } catch (e) {
        res.status(500).send()
    }
})



// dashboards

// router.get('/cook', auth, authRole('Admin'), (req,res) => {
//     // console.log(req.user)
//     res.send(`yeah u got me`)
// })

router.patch('/', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/cook', auth, (req, res) => {
    // console.log(req.user)
    res.send(`yeah u got me`)
})


module.exports = router;