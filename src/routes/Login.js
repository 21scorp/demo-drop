import './Login.css';
import {useState} from "react";
import axios from "axios";
import Profiel from "./Profiel";
import {redirect} from "react-router-dom"










export default function Login() { document.getElementById("welcome").style.display = "none";





    const [errorMessages, setErrorMessages] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const renderErrorMessage = (name) =>
        name === errorMessages.name && (
            <div className="error">{errorMessages.message}</div>
        );

    // User Login info
    const database = [
        {
            username: "user1",
            password: "pass1"
        },
        {
            username: "user2",
            password: "pass2"
        }
    ];

    const errors = {
        uname: "Verkeerde gebruikersnaam",
        pass: "Verkeerd wachtwoord"
    };

    const succesmess = {
        succ: "Je bent ingelogd!"
    }




        const handleSubmit = (event) => {


        //Prevent page reload
            event.preventDefault();



        const { uname, pass } = document.forms[0];

        // Find user login info
        const userData = database.find((user) => user.username === uname.value);

        // Compare user info
        if (userData) {
            if (userData.password !== pass.value) {
                // Invalid password
                setErrorMessages({ name: "pass", message: errors.pass });
            } else {
                setIsSubmitted(true)
            }
        } else {
            // Username not found
            setErrorMessages({ name: "uname", message: errors.uname });
        }
    };





    return (
        <main>



            <h2>Login</h2>
            <div className="vierkantbox">
                <div className="vierkant">
                    <form id="loginForm" onSubmit={handleSubmit}>
                        <label>
                            <input id="gebruikersnaam" type="text" name="uname" placeholder="Gebruikersnaam" required />
                            {renderErrorMessage("uname")}
                        </label>
                        <label>
                            <input id="wachtwoord" type="password" name="pass" placeholder="Wachtwoord" required />
                            {renderErrorMessage("pass")}
                        </label>
                        <input id="button" type="submit" value="Login"/>



                    </form>
                </div>
            </div>
        </main>
    );
}




