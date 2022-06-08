import './Login.css';
export default function Login() { document.getElementById("welcome").style.display = "none";
    return (
        <main>

            <h2>Login</h2>
            <div className="vierkantbox">
                <div className="vierkant">
                    <form>
                        <label>
                            <input id="gebruikersnaam" type="text" name="Gebruikersnaam" placeholder="Gebruikersnaam" />
                        </label>
                        <label>
                            <input id="wachtwoord" type="password" name="Wachtwoord" placeholder="Wachtwoord" />
                        </label>
                        <input id="button" type="submit" value="Login" />
                    </form>
                </div>
            </div>
        </main>
    );
}

