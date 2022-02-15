const { append, redirect, type } = require('express/lib/response');
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
        const fire = await Type.create({name:'Fire'});
        const grass = await Type.create({name:'Grass'});
        const water = await Type.create({name:'Water'});
        const bulbasaur = await Pokemon.create({name:'Bulbasaur',typeId:grass.id});
        const squirtle = await Pokemon.create({name:'Squirtle',typeId:water.id});
        const charmander = await Pokemon.create({name:'Charmander',typeId:fire.id});
    }catch(err){
        console.log(err)
    }
}
Pokemon.belongsTo(Type);
//express
const express = require('express');
const app = express();
app.use(express.urlencoded({extended:false}));
app.use(require('method-override')('_method'));
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

//route 

app.get('/',(req,res,next)=>{
    res.redirect('pokemons')
})

app.delete('/pokemons/:id',async(req,res,next)=>{
    try{
        const pokemon = await Pokemon.findByPk(req.params.id);
        await pokemon.destroy();
        console.log('pokemon goes back the nature!');
        res.redirect(`/types/${pokemon.typeId}`);
    }catch(err){
        next(err)
    }
})


app.post('/pokemons',async(req,res,next)=>{
    try{
        const pokemon = await Pokemon.create(req.body);
        res.redirect(`/types/${pokemon.typeId}`)
    }catch(err){
        next(err)
    }
})


app.get('/pokemons', async(req,res,next)=>{
    try{
        const pokemons = await Pokemon.findAll({
            include:[Type]
        });
        const types = await Type.findAll();
        const html = pokemons.map((pokemon)=>{
            return `<ul class = '${pokemon.type.name}'><li>${pokemon.name} <a href = '/types/${pokemon.type.id}'>${pokemon.type.name}</a></li></ul>`
        }).join('')
        res.send(
            `
            <html>
            <head>
            </head>
            <body>
                <h4>POKEMONS THAT I EARN</h4>
                <form method = 'POST'>
                    <input name = 'name' placeholder = 'pokemon name'></input>
                    <select name = 'typeId'>${types.map((type)=>{
                        return `<option value = ${type.id}>${type.name}</option>`
                    })}
                    </select>
                    <button>Register</button>
                </form>
                ${html}
            </body>
            </html>
            `
        )
    }catch(err){
        next(err);
    }
})

app.get('/types/:id', async(req,res,next)=>{
    try{
        const type = await Type.findByPk(req.params.id)
        const pokemons = await Pokemon.findAll(
            {
                where: {typeId : req.params.id}
            }
        )
        const html = pokemons.map((pokemon)=>{
            return `
            <ul><li>${pokemon.name}
            <form method = 'POST' action = '/pokemons/${pokemon.id}?_method=delete'>
            <button>
                RELEASE
            </button>
            </form>
            </li></ul>`
        }).join('')
        res.send(
            `
            <html>
            <head>
            </head>
            <body>
                <h4>POKEMONS THAT I EARN</h4>
                <h4 class = ${type.name}>${type.name}</h4>
                <a href ='/pokemons'>Back<a>
                ${html}
            </body>
            </html>
            `
        )
    }catch(err){
        next(err);
    }
})