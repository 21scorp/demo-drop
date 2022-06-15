import './Registratie.css'
import React, {useEffect} from "react";
import {useForm} from "react-hook-form";
import axios from "axios";

export default function Registratie() { document.getElementById("welcome").style.display = "none";






    const{ register,handleSubmit,formState:{errors}} = useForm();
    const onSubmit = data => console.log(data);




    return (
        <main>
            <h2>Registratie</h2>
            <div className="vierkantbox2">
                <div className="vierkant2">
                    <form id="RegistForm" onSubmit={handleSubmit(onSubmit)}>
                        <label>
                            <input id="gebruikersnaam2" type="text" {...register("Gebruikersnaam", {required:true} )} name="Gebruikersnaam" placeholder="Gebruikersnaam" />
                        </label>
                        <label>
                            <input id="email" type="text" {...register("Email", {required:true})} name="Email" placeholder="Email" />
                        </label>
                        <label>
                            <input id="wachtwoord2" type="password" {...register("Wachtwoord",{required:true})} name="Wachtwoord" placeholder="Wachtwoord" />
                        </label>
                        {errors.Gebruikersnaam?.type === "required" && "Gebruikersnaam vereist!"}
                        {errors.Email?.type === "required" && "Email vereist!"}
                        {errors.Wachtwoord?.type === "required" && "Wachtwoord vereist!"}
                        <input id="button2" type="submit" value="Registreer" />
                    </form>
                </div>
            </div>
        </main>
    );
}