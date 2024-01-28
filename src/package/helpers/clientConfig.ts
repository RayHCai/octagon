import dotenv from 'dotenv';

dotenv.config();
const { USER, PASSWORD, DATABASE, PORT } = process.env;

const clientConfig = {
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    port: Number(PORT),
};

export default clientConfig;
