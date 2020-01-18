'use strict'

const bcrypt = require('bcrypt')

class Users {
    constructor(db) {
        this.db = db
        this.ref = this.db.ref('/')
        this.collection = this.ref.child('users')
    }

    async create(data) {
        // console.log(`Datos: ${data}`)
        // Destructuro el objeto con el payload enviado. Ya que Hapi lo decora con un prototipo null que no es compatible con Firebase
        const user = {
            ...data
        }
        // Se genera una contraseña encriptada a partir de la proporcionada. this.constructor llama a la clase, ya que el método encrypt es estático
        user.password = await this.constructor.encrypt(user.password)
        const newUser = this.collection.push(user)
        // Retornamos el id del usuario
        return newUser.key
    }

    async validateUser(data) {
        const userQuery = await this.collection.orderByChild('email').equalTo(data.email).once('value')
        const userFound = userQuery.val()
        if (userFound) {
            const userId = Object.keys(userFound)[0]
            const passwdRight = await bcrypt.compare(data.password, userFound[userId].password)
            const result = (passwdRight) ? userFound[userId] : false
            return result
        }

        return false
    }

    static async encrypt(passwd) {
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(passwd, saltRounds)
        return hashedPassword
    }
}

module.exports = Users