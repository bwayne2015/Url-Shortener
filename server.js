'use strict';

const Hapi = require('hapi');
const uuid = require('node-uuid')
const server = new Hapi.Server();
const crypto = require('crypto');
const mongojs = require('mongojs');
const mongoose = require('mongoose');
const Boom = require('boom');
server.connection({ port: 3000, host: 'localhost' });


server.app.db = mongojs('url-short-db', ['urls']);
const db = server.app.db;





server.route({
    method: 'GET',
    path: '/{url}',
    handler: function (request, reply) {
        var name = request.params.url
        var hash = crypto.createHash('md5').update(name).digest('hex');
        hash = hash.substring(0,10);


        db.urls.update({hash:hash},{hash: hash, name: name, isBurnedLink: false},{upsert:true} ,function (err, res) {
            if (err) {
                reply((Boom.wrap(err,"Something went wrong")));
            }
            reply("Your Short Url is: " +"http://localhost:3000/decode/" + hash);

        });



        //return ('Hello, ' + encodeURIComponent(request.params.name) + '!');



    }
});

server.route({
    method: 'GET',
    path: '/decode/{id}',
    handler: function (request, reply) {
        var hash = request.params.id

        db.urls.findOne({hash: hash}, (err, doc) => {

            if (err) {
                reply(Boom.wrap(err, 'Internal MongoDB error'));
            }

            if (!doc) {
                return reply(Boom.notFound("The Data Does not exist in database"));
            }
            const link = doc.name;
            if(doc.isBurnedLink) {
                db.urls.remove(doc, (err, doc) => {
                    if(err) {
                        reply(Boom.wrap(err, 'Internal MongoDB Error'))
                    }
                });
            }
            //reply(doc.name);
            reply.redirect("https://"+ link);

        });

    }

});
server.route({
    method: 'GET',
    path: '/burnurl/{url}',
    handler: function (request, reply) {
        var name = request.params.url

        var hash = crypto.createHash('md5').update(name + new Date().getTime()).digest('hex');
        var hash = hash.substring(0,10);
        //var uid = uuid.v4();
        //var hash= findhash(uid);
        db.urls._id = hash;


        db.urls.save({hash: hash, name: name, isBurnedLink: true}, function (err, res) {
            if (err) {
                reply( h(Boom.wrap(err,"Something went wrong")));
            }
            reply("Your One Time Url is: " +"http://localhost:3000/decode/" + res.hash);

        });



        //return ('Hello, ' + encodeURIComponent(request.params.name) + '!');



    }
});



server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});