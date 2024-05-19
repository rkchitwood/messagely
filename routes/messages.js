const Router = require('express').Router;
const User = require('../models/user');
const Message = require('../models/message');
const {ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth');

const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function(req, res, next){
    try{
        let msg = await Message.get(req.params.id);
        let username = req.user.username;
        const { from_user, to_user } = msg;
        if (from_user.username !== username && to_user.username !== username) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        return res.json({msg});
    }catch(err){
        return next(err);
    }
});




/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function(req, res, next){
    try{
        let {from_username, to_username, body} = req.params;
        if (from_username !== req.user.username){
            return res.status(403).json({ error: 'unauthorized' });
        }
        let msg = await Message.create(from_username, to_username, body);
        return res.json({msg});
    }catch(err){
        return next(err);
    }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async function(req, res, next){
    try{
        let id = req.params.id;
        let msg = await Message.get(id);
        if(msg.to_user !== req.user){
            return res.status(403).json({ error: 'unauthorized' });
        }
        let result = await Message.markRead(id);
        return res.json({result});
    }catch(err){
        return next(err);
    }
});

module.exports = router;