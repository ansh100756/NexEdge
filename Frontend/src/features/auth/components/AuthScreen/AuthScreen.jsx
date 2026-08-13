import { LoginForm } from '../LoginForm/LoginForm';
import { RegisterForm } from '../RegisterForm/RegisterForm';

export function AuthScreen({mode}){return mode==='register'?<RegisterForm/>:<LoginForm/>}
