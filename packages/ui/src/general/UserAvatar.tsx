import { getInitials } from "@repo/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";

interface UserAvatarProps {
	avatarUrl: string;
	name: string;
	className?: string;
}

const UserAvatar = ({ avatarUrl, name, className }: UserAvatarProps) => {
	return (
		<Avatar className={className}>
			<AvatarImage src={avatarUrl || undefined} />
			<AvatarFallback>{getInitials(name)}</AvatarFallback>
		</Avatar>
	);
};

export default UserAvatar;
