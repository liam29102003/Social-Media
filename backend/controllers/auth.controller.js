export const signup = async (req, res) => {
    const { username, password } = req.body;
    res.send("signup");
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    res.send("login");
};

export const logout = async (req, res) => {
    res.send("logout");
};