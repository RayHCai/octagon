import Model, { IntegerField, StringField } from '../package/model.js';

class User extends Model {
    name = StringField({ defaultValue: 'John Doe', maxLength: 255 });
    email = StringField();
    age = IntegerField({ optional: true });

    greet() {
        console.log(
            `Hey! I'm ${this.name}${
                this.age ? " and I'm " + this.age + ' years old' : ''
            }. You can reach me at ${this.email}.`
        );
    }
}

const user = new User().init({
    email: 'hjkareus@gmail.com',
    age: 19,
});

user.greet();
await user.save();

const user2 = new User().init({
    name: 'Doug',
    email: 'rcf6@calvin.edu',
});

user2.greet();
await user2.save();

const user3 = new User().init({
    name: 'Charles',
    email: 'test@test.com',
    age: 19,
});

user3.greet();
await user3.save();

const usersThatAre19 = await User.filter({
    age: 19,
});

console.log(usersThatAre19.length);

const doug = (
    await User.filter({
        name: 'Doug',
    })
)[0];

doug.age = 22;
await doug.save();

doug.greet();
