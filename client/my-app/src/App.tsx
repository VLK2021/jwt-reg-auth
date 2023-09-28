import React, {FC, useContext, useEffect, useState} from 'react';
import {observer} from "mobx-react-lite";

import LoginForm from "./components/LoginForm/LoginForm";
import {Context} from "./index";
import {IUser} from "./models/IUser";
import UserService from "./services/UserService";


const App: FC = () => {
    const {store} = useContext(Context);
    const [users, setUsers] = useState<IUser[]>([]);


    useEffect(() => {
        if (localStorage.getItem('token')) {
            store.checkAuth();
        }

    }, []);

    if (store.isLoading) {
        return <div>Loading...</div>
    }


    async function getUsers() {
        try {
            const response = await UserService.fetchUsers();
            setUsers(response.data);
        } catch (e) {
            console.log(e);
        }
    }




    if (!store.isAuth) {
        return (
            <div>
                <LoginForm/>
                <button onClick={getUsers}>Users</button>
            </div>
        )
    }


    return (
        <div className="App">
            <h1>{store.isAuth ? `користувач авторизований ${store.user.email}` : 'АВТОРИЗУЙТЕСЬ'}</h1>
            <h1>{store.user.isActivated ? `користувач активував почту` : 'АКТИВУЙТЕ ПОЧТУ'}</h1>
            <button onClick={() => store.logout()}>Logout</button>

            <div>
                <button onClick={getUsers}>Users</button>
            </div>

            {
                users.map(user =>
                <div key={user.email}>
                    {user.email}
                </div>)
            }
        </div>
    );
}

export default observer(App);
