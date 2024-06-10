const { User } = require("../models/user");

module.exports = async (req, res, next) => {
    req.isAdmin = false;

    try {
        const user = await User.findById(req.userId);

        if(!user)  {
            const error = new Error("This user does not aaaaaaaaaaaaa exist!");
            error.statusCode = 400;
            throw error;
        }

        if(!user.isAdmin)  {
            const error = new Error("You do not have permission!");
            error.statusCode = 400;
            throw error;
        }


        req.isAdmin = user.isAdmin;
    } catch(error) {
        next(error);
    }

    next();
}