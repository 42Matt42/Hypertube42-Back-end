const sgMail = require('@sendgrid/mail');
const config = require('../config/config');

const templates = {
    ACTIVATE: {
        subject:'Activate account',
        html0: 'Hello ',
        html1: ',<br><br>Your email has been used to register on HT42. If you haven\'t registered, please ignore this email.' +
            'To activate the account, please click on this link: ',
        html2: '<br><br>Kind regards,<br>HT42 Team',
        link: '/users/activation/'
    },
    RESET: {
        subject:'Reset password',
        html0: 'Hello ',
        html1: ',<br><br>You have requested to reset your password at HT42. If you haven\'t done that, please ignore this email.' +
            'To reset your password, please click on this link: ',
        html2: '<br><br>Kind regards,<br>HT42 Team',
        link: '/users/activation/'
    }
}

sgMail.setApiKey(config.sg);
const msg = {
    to: null,
    from: config.email,
    subject: null,
    html: null,
};

async function send(to, username, token, template){
    let link = config.server + template.link + token;
    msg.subject = template.subject;
    msg.html = template.html0 + username + template.html1 + link + template.html2;
    msg.to = to;
    try {
        await sgMail.send(msg);
        return true;
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
            return false;
        }
    }
};

module.exports = {
    send,
    templates
}
