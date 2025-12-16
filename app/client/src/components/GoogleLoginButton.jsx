import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function GoogleLoginButton() {
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        //console.log("ENV GOOGLE CLIENT ID:", import.meta.env.GOOGLE_CLIENT_ID);

        if (!window.google) return;

        window.google.accounts.id.initialize({
            client_id: import.meta.env.GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
            document.getElementById("google-login-btn"),
            {
                theme: "outline",
                size: "large",
                width: "100%",
            }
        );
    }, []);

    const handleGoogleResponse = async (response) => {
        try {
            const res = await api.post(
                "/auth/google-login",
                { credential: response.credential },
                { withCredentials: true }
            );

            if (res.data.needsFinishRegistration) {
                navigate(`/finish-register?token=${res.data.token}`);
                return;
            }

            setUser(res.data.user);
            navigate("/");
        } catch (err) {
            console.error(err.response?.data?.message || "Google login error");
        }
    };

    return <div id="google-login-btn"></div>;
}
