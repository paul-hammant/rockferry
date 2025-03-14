import { Resource } from "../../../types/resource";
import { Node } from "../../../types/node";

interface Props {
    node: Resource<Node>;
}

export const OptionsView: React.FC<Props> = ({ node }) => {
    return <div>Options</div>;
};
