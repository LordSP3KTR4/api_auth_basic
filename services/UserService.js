import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
const createUser = async (req) => {
    const {
        name,
        email,
        password,
        password_second,
        cellphone
    } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: 'Passwords do not match'
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email
        }
    });
    if (user) {
        return {
            code: 400,
            message: 'User already exists'
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });
    return {
        code: 200,
        message: 'User created successfully with ID: ' + newUser.id,
    }
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            }
        })
    };
}

const updateUser = async (req) => {
    const user = db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        }
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id
        }

    });
    return {
        code: 200,
        message: 'User updated successfully'
    };
}

const deleteUser = async (id) => {
    /* await db.User.destroy({
        where: {
            id: id
        }
    }); */
    const user = db.User.findOne({
        where: {
            id: id,
            status: true,
        }
    });
    await  db.User.update({
        status: false
    }, {
        where: {
            id: id
        }
    });
    return {
        code: 200,
        message: 'User deleted successfully'
    };
}

//Ejercicio1
const getAllUsers = async () => {
    return {
        code: 200,
        message: await db.User.findAll({
            where: {
                status: true,
            }
        })
    };
}

//Ejercicio2
const findUsers = async (QueryParams) => {
    
    const { status, name, loginDateBefore, loginDateAfter } = QueryParams;

    if (status == 'false') {
        const where = {status: false};
        return {
            code: 200,
            message: await db.User.findAll({
                where,
            }),
        };}
    
    const where = {status: true};
    if (name) {
        where.name = {
            [Op.like]: `%${name}%`,
        };
    }

    if (loginDateBefore) {
        const [date] = loginDateBefore.split(":");
        //abre la tabla sessions y filtra segun fecha
        const sessions = await db.Session.findAll({
            where: {
                createdAt: {
                    [Op.lte]: date,
                },
            },
        });

        //filtra los usuarios segun las id que obtuvo en sessions
        const userIds = sessions.map((session) => session.id_user);
        where.id = {
            [Op.in]: userIds,
        };

    }

    if (loginDateAfter) {
        const [date] = loginDateAfter.split(":");
        const sessions = await db.Session.findAll({
            where: {
                createdAt: {
                    [Op.gte]: date,
                },
            },
        });
        const userIds = sessions.map((session) => session.id_user);
        where.id = {
            [Op.in]: userIds,
        };

    }


    return {
        code: 200,
        message: await db.User.findAll({
            where,
        }),
    }; 
};

//Ejercicio 3

export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    findUsers
}