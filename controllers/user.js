'use strict'

const Boom = require('boom')
const users = require('../models/index').users

async function createUser(req, h) {
    let result
    try {
        result = await users.create(req.payload)
    }
    catch (error) {
        console.error(error)
        return h.view('register', {
            title: 'Registro',
            error: 'Error creando el usuario'
        })
    }

    return h.view('register', {
        title: 'Registro',
        succes: 'Usuario creado exitosamente'
    })

}

async function validateUser(req, h) {
    let result
    try {
        result = await users.validateUser(req.payload)
        if (!result) {
            return h.view('login', {
                title: 'Login',
                error: 'Email y/o contraseña incorrecta'
            })
        }
    }
    catch (error) {
        console.error(error)
        return h.view('login', {
            title: 'Login',
            error: 'Problemas validando el usuario'
        })
    }

    return h.redirect('/').state('user', {
        name: result.name,
        email: result.email
    })

}

function logout(req, h) {
    return h.redirect('/login').unstate('user')
}

function faildValidation(req, h, err) {
    const templates = {
        '/create-user': 'register',
        '/validate-user': 'login',
        '/create-question': 'ask'
    }

    return h.view(templates[req.path], {
        title: 'Error de validación',
        error: 'Por favor complete los campos requeridos'
    }).code(400).takeover()

}

module.exports = {
    createUser: createUser,
    faildValidation: faildValidation,
    logout: logout,
    validateUser: validateUser
}