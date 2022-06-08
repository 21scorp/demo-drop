import './Registratie.css'
export default function Registratie() { document.getElementById("welcome").style.display = "none";
    return (
        <main>
            <h2>Registratie</h2>
            <div className="vierkantbox2">
                <div className="vierkant2">
                    <form>
                        <label>
                            <input id="gebruikersnaam2" type="text" name="Gebruikersnaam" placeholder="Gebruikersnaam" />
                        </label>
                        <label>
                            <input id="email" type="text" name="Email" placeholder="Email" />
                        </label>
                        <label>
                            <input id="wachtwoord2" type="password" name="Wachtwoord" placeholder="Wachtwoord" />
                        </label>
                        <input id="button2" type="submit" value="Login" />
                    </form>
                </div>
            </div>
        </main>
    );
}