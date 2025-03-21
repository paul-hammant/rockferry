import { Box, Text } from "@radix-ui/themes";
import { Fragment } from "react";
import { Resource, ResourceKind } from "../types/resource";
import { WithOwner } from "./withowner";
import { useNavigate } from "react-router";

interface BreadcrumbsInnerProps {
    res: Resource<any, any>;
    root: Resource<any, any>;
}

interface BreadcrumbsTextProps {
    res: Resource<any, any>;
    parent: boolean;
}

const BreadcrumbsText: React.FC<BreadcrumbsTextProps> = ({ res, parent }) => {
    const navigate = useNavigate();

    if (!parent) {
        return <Text size="6">{res.spec.name}</Text>;
    } else {
        return (
            <Text
                className="hover:cursor-pointer"
                color="purple"
                onClick={() => {
                    if (res.kind == ResourceKind.Instance) {
                        navigate("/");
                    } else {
                        navigate(`/${res.kind}/${res.id}`);
                    }
                }}
            >
                <Text size="6">{res.spec.name}</Text>
            </Text>
        );
    }
};

const BreadcrumbsInner: React.FC<BreadcrumbsInnerProps> = ({ root, res }) => {
    return (
        <>
            {res.owner ? (
                <WithOwner<any> res={res}>
                    {({ owner }) => (
                        <>
                            <BreadcrumbsInner res={owner} root={root} />
                            <Text size="5" mr="1" ml="1">
                                /
                            </Text>
                            {res == root}
                            <BreadcrumbsText
                                res={res}
                                parent={!(res == root)}
                            />
                        </>
                    )}
                </WithOwner>
            ) : (
                <BreadcrumbsText res={res} parent={!(res == root)} />
            )}
        </>
    );
};

export const Breadcrumbs: React.FC<Props> = ({ res }) => {
    return <BreadcrumbsInner res={res} root={res} />;
};
