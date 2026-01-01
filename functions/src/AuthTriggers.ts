import {beforeUserCreated} from 'firebase-functions/v2/identity';
import {logger} from 'firebase-functions/v2';

export const addRolesOnUserCreation = beforeUserCreated  (async (event) =>
  {
    const user = event.data;
    
    // Check if this user is authenticated with Google provider.
    const isGoogleProvider = event.credential?.providerId === 'google.com';
    //An unverified email is marked with a role and will have limited access.
    // If a walton user and using the google Oauth provider, assign admin role.
    // reject walton users who try a different provider on signup to ensure can't have a fake admin user.
    // All other verified users are assigned the user role.
    if (! user?.emailVerified) {
      return {
            customClaims: {
              role: "unverified"
           }
        };

    } else if (user?.email?.endsWith('@waltonrobotics.org')) {
      if (! isGoogleProvider) {
         logger.info(`New waltonrobotics.org user: ${user.email}. Assigning admin role.`);
         return {
            customClaims: {
              role: "admin"
           }
        };
      } else {  
        throw new Error("User from waltonrobotics.org must sign up with Google provider.")
      }
    }
    else {
      return { 
        customClaims : {
          role: "user"
        } 
     };
    }
  }
);
