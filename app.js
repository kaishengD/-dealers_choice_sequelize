const { append } = require('express/lib/response');
const pg = require('pg');
const Sequelize = require('sequelize');

const user = 'postgres';
const host = 'localhost';
const database = 'pokemon_book';
const password = '123456';
const port = 5432;
const db = new Sequelize(database,user,password,{
    host,
    port,
    dialect: 'postgres',
    logging: console.log
});

const Type = db.define('type',{
    name:{
        type: Sequelize.STRING,
        allowNull: false
}}); 

const Pokemon = db.define('pokemon',{
    name:{
        type: Sequelize.STRING,
        allowNull: false,
    },
    typeId:{
        type: Sequelize.INTEGER,
        allowNull: false
    }
}); 

const syncAndSeed = async()=>{
    try{
        const fire = await Type.create({name:'fire'});
        const grass = await Type.create({name:'grass'});
        const water = await Type.create({name:'water'});
        const bulbasaur = await Pokemon.create({name:'bulbasaur',typeId:grass.id});
        const squirtle = await Pokemon.create({name:'squirtle',typeId:water.id});
        const charmander = await Pokemon.create({name:'charmander',typeId:fire.id});
    }catch(err){
        console.log(err)
    }
}

const express = require('express');
const app = express();
const init = async()=>{
    await db.authenticate();
    console.log('connected')
    await db.sync({force:true});
    syncAndSeed();
    const port = 3000;
    app.listen(port,()=>{
        console.log(`listening on port: ${port}`)
    })
}

init();