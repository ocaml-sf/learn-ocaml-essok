import { RouterButton, RouterButtonImpl } from './routerButton';

const ACTIVATE : RouterButton =
    new RouterButtonImpl({
        body: "Activate your Account",
        color: "warn",
        routerLink: "/disable-account",
    });

const ADMINPANEL : RouterButton =
    new RouterButtonImpl({
        body: "Admin Panel",
        color: "warn",
        routerLink: "/admin",
    });

const CONTACTS : RouterButton =
    new RouterButtonImpl({
        body: "Contacts",
        color: "info",
        routerLink: "/contact",
    });

const HELP : RouterButton =
    new RouterButtonImpl({
        body: "Help",
        color: "info",
        routerLink: "/help",
    });

const HOME : RouterButton =
    new RouterButtonImpl({
        body: "Home",
        color: "primary",
        routerLink: "/",
        options: { exact: true },
    });

const NEWSERVER : RouterButton =
    new RouterButtonImpl({
        body: "New Server",
        color: "secondary",
        routerLink: "/editor",
    });

const PROFILE = function (username : string) : RouterButton {
    return new RouterButtonImpl({
        body: username,
        color: "secondary",
        routerLink: `/${username}`,
    });
}

const PROFILESETTINGS = function (username : string) : RouterButton {
    return new RouterButtonImpl({
        body: "Profile Settings",
        color: "secondary",
        routerLink: `/profile-settings/${username}`,
    });
}

const SIGNIN : RouterButton =
    new RouterButtonImpl({
        body: "Sign in",
        color: "secondary",
        routerLink: "/login"
    });

const SIGNUP : RouterButton =
    new RouterButtonImpl({
        body: "Sign up",
        color: "secondary",
        routerLink: "/register"
    });


/*
 * For unlogged users
 */
const ANONYMOUSUSERS : RouterButton[] =
    [
        HOME,
        SIGNIN,
        SIGNUP,
        CONTACTS,
    ];

/*
 * For users that have disabled their account
 */
const DISABLEDUSERS : RouterButton[] =
    [
        HOME,
        ACTIVATE,
        CONTACTS,
        HELP,
    ];

/*
 * For users where their account is pending verification
 */
const PENDINGUSERS : RouterButton[] =
    [
        HOME,
        CONTACTS,
        HELP,
    ];

function newREGULARUSERS(username : string) : RouterButton[] {
    return [
        HOME,
        NEWSERVER,
        PROFILESETTINGS(username),
        PROFILE(username),
        CONTACTS,
        HELP,
    ];
}

function newADMINUSERS(username : string) : RouterButton[] {
    return [
        HOME,
        NEWSERVER,
        PROFILESETTINGS(username),
        PROFILE(username),
        CONTACTS,
        HELP,
        ADMINPANEL,
    ];
}

export const BUTTONS =
    {
        ANONYMOUSUSERS,
        DISABLEDUSERS,
        PENDINGUSERS,
        newREGULARUSERS,
        newADMINUSERS,
        REGULARUSERS : [],
        ADMINUSERS : [],
    };
