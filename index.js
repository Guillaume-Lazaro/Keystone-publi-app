const { Keystone } = require('@keystonejs/keystone');
const { PasswordAuthStrategy } = require('@keystonejs/auth-password');
const { Text, Checkbox, Password, Relationship, File } = require('@keystonejs/fields');
const { LocalFileAdapter } = require('@keystonejs/file-adapters');
const { GraphQLApp } = require('@keystonejs/app-graphql');
const { AdminUIApp } = require('@keystonejs/app-admin-ui');
const initialiseData = require('./initial-data');

const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose');

const PROJECT_NAME = 'publi-keystone';
const adapterConfig = { mongoUri: 'mongodb://localhost/publi-keystone' };


const keystone = new Keystone({
  name: PROJECT_NAME,
  adapter: new Adapter(adapterConfig),
  onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
});

const fileAdapter = new LocalFileAdapter({
  src: './public/files',
  path: '/files',
});

// Access control functions
const userIsAdmin = ({ authentication: { item: user } }) => Boolean(user && user.isAdmin);
const userOwnsItem = ({ authentication: { item: user } }) => {
  if (!user) {
    return false;
  }
  return { id: user.id };
};
const userIsPublisher   = ({ authentication: { item: user}}) => Boolean(user && user.isPublisher);
const userIsOwner  = ({ authentication: { item: user}}) => Boolean(user && user.userIsOwner);

const userIsAdminOrOwner = auth => {
  const isAdmin = access.userIsAdmin(auth);
  const isOwner = access.userOwnsItem(auth);
  // const isOwner = access.userIsOwner(auth);
  return isAdmin ? isAdmin : isOwner;
};
const userIsAdminOrPublisher = auth => {
  const isAdmin = access.userIsAdmin(auth);
  const isPublisher = access.userIsPublisher(auth);
  return isAdmin ? isAdmin : isPublisher;
};
const userIsPublisherOrOwner = auth => {
  const isPublisher = access.userIsPublisher(auth);
  const isOwner = access.userOwnsItem(auth);
  // const isOwner = access.userIsOwner(auth);
  return isPublisher ? isPublisher : isOwner;
};

const userIsAdminOrPublisherOrOwner = auth => {
  const isAdmin = access.userIsAdmin(auth);
  const isPublisher = access.userIsPublisher(auth);
  const isOwner = access.userOwnsItem(auth);
  if(isAdmin || isPublisher || isOwner) {
    return true;
  } 
  return false;
}

const access = { userIsAdmin, userOwnsItem, userIsPublisher, userIsOwner, userIsAdminOrOwner, userIsAdminOrPublisher, userIsPublisherOrOwner, userIsAdminOrPublisherOrOwner };

keystone.createList('User', {
  fields: {
    name: { type: Text },
    email: {
      type: Text,
      isUnique: true,
    },
    isAdmin: {
      type: Checkbox,
      defaultValue: false,
      access: {
        create: access.userIsAdmin,
        read:   access.userIsAdmin,
        delete: access.userIsAdmin,
        update: access.userIsAdmin,
      },
    },
    isPublisher: {
      type: Checkbox,
      defaultValue: false,
      // access: {    //Rien du tout, tout le monde peut etre publisher
      //   update: access.userIsAdmin,
      // },
    },
    password: {
      type: Password,
    },
    // articles: {
    //   type: Relationship, ref: 'Article', many: true,
    // }
  },
  access: {
    update: access.userIsAdminOrOwner,
    delete: access.userIsAdmin,
    auth: true,
  },
});

keystone.createList('Article', {
  fields: {
    title:    { type: Text, isRequired: true },
    summary:  { type: Text, isRequired: true },
    picture:  { type: File, adapter: fileAdapter },
    content:  { type: Text, isRequired: true },
    category: { type: Relationship, ref: 'Category', many: true, isRequired: true },
    user:     { type: Relationship, ref: 'User', isRequired:true },
    isPublished:  { type: Checkbox, defaultValue: false, access: {
        // create: access.userIsAdminOrPublisher,
        update: access.userIsAdminOrPublisher,
      },
    },
  },
  labelField: "title",
  access: {
    read: access.userIsAdminOrPublisherOrOwner,
    update: access.userIsAdminOrPublisherOrOwner,
    delete: access.userIsAdminOrPublisherOrOwner,
  },
});

keystone.createList('Category', {
  fields: {
    title: { type: Text, isRequired: true},
  },
  labelField: "title",
  access: { //Tout le monde peut gérer les catégories, sauf pour supprimer (admin)
    delete: access.userIsAdmin,
    auth: true,
  },
});

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
});

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({
      enableDefaultRoute: true,
      authStrategy,
    }),
  ],
};
