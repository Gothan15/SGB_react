import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import PropTypes from "prop-types";

const AvatarUser = ({ userProfile, userInfo }) => {
  const getInitial = () => {
    if (userProfile?.name) return userProfile.name.charAt(0);
    if (userInfo?.displayName) return userInfo.displayName.charAt(0);
    if (userInfo?.email) return userInfo.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <Avatar>
      <AvatarImage
        src={userProfile?.photoURL || userInfo?.photoURL}
        alt="Avatar"
      />
      <AvatarFallback>{getInitial()}</AvatarFallback>
    </Avatar>
  );
};

AvatarUser.propTypes = {
  userProfile: PropTypes.shape({
    name: PropTypes.string,
    photoURL: PropTypes.string,
  }),
  userInfo: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string,
  }),
};

export default AvatarUser;
