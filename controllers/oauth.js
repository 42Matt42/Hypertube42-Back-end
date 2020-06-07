const jwt = require("jsonwebtoken");
const fs = require("fs");
const config = require("../config/config");
const axios = require("axios").default;
const db = require("../models/index");
const sequelize = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

function downloadFile(fileUrl, outputLocationPath) {
  const writer = fs.createWriteStream(outputLocationPath);

  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then((response) => {
    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}

async function checkOrCreateUser(email, fullName, username, photo) {
  try {
    let result = await db.user.findAndCountAll({
      attributes: [
        "id",
        "username",
        "photo",
        //   [sequelize.fn('COUNT', sequelize.col('id')), 'n_id'],
      ],
      where: {
        email,
      },
    });
    if (result.count === 0) {
      let pathname = "uploads/";
      let filename = uuidv4() + path.extname(photo);
      let outputLocationPath = pathname + filename;
      await downloadFile(photo, outputLocationPath);
      result = await db.user.create({
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ")[1],
        email,
        username,
        photo: outputLocationPath,
        password: "C688f438cdd6bb41fbea3e8aa7a9aed3",
      });
    } else {
      result = result.rows[0];
    }
    return result;
  } catch (error) {
    throw new Error(error);
  }
}

exports.redirect42 = async (req, res) => {
  let code = req.query.code;
  try {
    let response = await axios.post("https://api.intra.42.fr/oauth/token", {
      grant_type: "authorization_code",
      client_id: config.client42,
      client_secret: config.secret42,
      code: code,
      redirect_uri: config.redirect42,
    });
    let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${response.data.access_token}`;
    let userData = await axios.get("https://api.intra.42.fr/v2/me");
    if (
      !userData.data.email ||
      !userData.data.first_name ||
      !userData.data.last_name
    ) {
      return res.redirect(304, "http://localhost:8080/login");
    }
    let name = userData.data.first_name + " " + userData.data.last_name;
    let result = await checkOrCreateUser(
      userData.data.email,
      name,
      userData.data.login,
      userData.data.image_url,
    );
    const jwt_token = jwt.sign(
      {
        exp: exp,
        data: {
          id: result.dataValues.id,
          username: result.dataValues.username,
          photo: result.dataValues.photo,
        },
      },
      config.jwt,
    );
    return res.redirect("http://localhost:8080?code=" + jwt_token);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.redirect("http://localhost:8080");
    }
    console.log(error);
    return res.redirect("http://localhost:8080");
  }
};
exports.redirectGitHub = async (req, res) => {
  let code = req.query.code;
  try {
    let response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: config.clientGH,
        client_secret: config.secretGH,
        code: code,
      },
    );
    let token = await response.data.split("&")[0].split("=")[1];
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    let userData = await axios.get("https://api.github.com/user");
    if (
      !userData.data.email ||
      !userData.data.name ||
      !userData.data.login ||
      !userData.data.avatar_url
    ) {
      return res.redirect( "http://localhost:8080/login");
    }
    let result = await checkOrCreateUser(
      userData.data.email,
      userData.data.name,
      userData.data.login,
      userData.data.avatar_url,
    );
    let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const jwt_token = jwt.sign(
      {
        exp,
        data: {
          id: result.dataValues.id,
          username: result.dataValues.username,
          token: result.dataValues.access_token,
          photo: result.dataValues.photo,
        },
      },
      config.jwt,
    );
    return res.redirect("http://localhost:8080?code=" + jwt_token);
  } catch (error) {
    console.log(error);
    return res.redirect("http://localhost:8080");
  }
};
exports.redirectFacebook = async (req, res) => {
  let code = req.query.code;
  try {
    let response = await axios.get(
<<<<<<< HEAD
      `https://graph.facebook.com/v6.0/oauth/access_token?client_id=${config.clientFB}&client_secret=${config.secretFB}&code=${code}&redirect_uri=${config.server}/oauth/fb`,
=======
      `https://graph.facebook.com/v6.0/oauth/access_token?client_id=${config.clientFB}&client_secret=${config.secretFB}&code=${code}&redirect_uri=${config.redirectFB}/oauth/fb`
>>>>>>> 6a13886c47e8a7b04e5334e7f28c450b0c1e583e
    );
    let exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    let userData = await axios.get(
      `https://graph.facebook.com/v6.0/me?fields=last_name,picture{url},email,name&access_token=${response.data.access_token}`,
    );
    let result = {};
    console.log(userData.data);
    if (userData.data.email) {
      result = await checkOrCreateUser(
        userData.data.email,
        userData.data.name,
        userData.data.last_name,
        userData.data.picture.data.url,
      );
    } else {
      return res.redirect("http://localhost:8080");
    }
    const jwt_token = jwt.sign(
      {
        exp,
        data: {
          id: result.dataValues.id,
          username: result.dataValues.username,
          token: result.dataValues.access_token,
          photo: result.dataValues.photo,
        },
      },
      config.jwt,
    );
    return res.redirect("http://localhost:8080?code=" + jwt_token);
  } catch (error) {
    console.log(error);
    return res.redirect("http://localhost:8080");
  }
};
