import { Button, CloseButton, FileButton, Grid, Group, Input, Modal, NativeSelect, Space, Stack, Text } from "@mantine/core"
import { Dispatch, SetStateAction, useState } from "react";
import { FaTerminal } from "react-icons/fa"
import { submitCommand, endpoints } from "../../modules/nimplant";
import { notifications } from "@mantine/notifications";
import { api } from "../../modules/api";



interface IProps {
    modalOpen: boolean;
    setModalOpen: Dispatch<SetStateAction<boolean>>;
    npGuid: string | undefined;
}

interface Argument {
    value: string;
    type: string;
}

function InlineExecuteModal({ modalOpen, setModalOpen, npGuid }: IProps) {
    const [bofFile, setBofFile] = useState<File | null>(null);
    const [bofEntryPoint, setBofEntryPoint] = useState("go");
    const [bofArgs, setBofArgs] = useState<Argument[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);

    const addArgument = () => {
        setBofArgs([...bofArgs, { value: "", type: "z" }]);
    };

    const updateArgument = (index: number, value: string, type: string) => {
        setBofArgs(bofArgs.map((arg, i) => (i === index ? { value, type } : arg)));
    };

    const removeArgument = (index: number) => {
        setBofArgs(bofArgs.filter((_, i) => i !== index));
    };

    const submit = async () => {
        if (!bofFile) return;

        try {
            setSubmitLoading(true);
            const formData = new FormData();
            formData.append('file', bofFile);
            formData.append('filename', bofFile.name);

            let uploadUrl = endpoints.upload;
            if (npGuid) {
                uploadUrl = `${endpoints.upload}?nimplant_guid=${npGuid}`;
            }

            const uploadResult = await api.upload(uploadUrl, formData);

            if (!uploadResult || !uploadResult.hash) {
                throw new Error("Upload did not return a valid hash.");
            }

            notifications.show({
                title: 'Success',
                message: 'File uploaded successfully!',
                color: 'green',
            });

            const argsForCommand: string[] = bofArgs.map((arg) => {
                let valueToSend = arg.value;
                if (arg.type === 'b') {
                    console.warn("Binary argument type 'b' selected, ensure value is properly formatted (e.g., hex) if needed by BOF.");
                }
                return `"${valueToSend.replace(/"/g, '\\"')}" ${arg.type}`;
            });

            const finalArgString = argsForCommand.length > 0 ? ' ' + argsForCommand.join(' ') : '';

            const executeCommand = `inline-execute "${uploadResult.hash}" "${bofEntryPoint}"${finalArgString}`;

            console.log(`Sending execute-assembly command: ${executeCommand}`);

            if (npGuid) {
                submitCommand(npGuid, executeCommand, callbackClose);
            } else {
                throw new Error("No active Nimplant GUID found.");
            }

        } catch (error) {
            notifications.show({
                title: 'Error',
                message: `Operation failed: ${error instanceof Error ? error.message : String(error)}`,
                color: 'red',
            });
            setSubmitLoading(false);
        }
    };

    const callbackClose = () => {
        setModalOpen(false);
        setBofFile(null);
        setBofEntryPoint("go");
        setBofArgs([]);
        setSubmitLoading(false);
    };
    
    return (
        <Modal
            opened={modalOpen}
            onClose={() => setModalOpen(false)}
            title={<b>Inline-Execute: Execute BOF file</b>}
            size="auto"
            centered
        >
            <Text>Execute a Beacon Object File (BOF) in-memory.</Text>
            <Text>Caution: BOF crashes will crash Implant too!</Text>

            <Space h='xl' />

            {/* File selector */}
            <Grid columns={4}>
                <Grid.Col span={3}>
                    <Group grow>
                        <FileButton onChange={setBofFile}>
                            {(props) => <Button color={"gray"} {...props}>
                                {bofFile ? "BOF file: " + bofFile.name  : "Select x64 BOF file"}
                            </Button>}
                        </FileButton>
                    </Group>
                </Grid.Col>
            
            {/* Entrypoint */}
                <Grid.Col span={1}>
                    <Input 
                    placeholder="Entrypoint"
                    value={bofEntryPoint}
                    onChange={(event) => setBofEntryPoint(event.currentTarget.value)}
                    />
                </Grid.Col>
            </Grid>

            {/* Dynamic argument selection */}
            <Stack py={bofArgs.length > 0 ? "lg" : "sm"}>
                {bofArgs.map((arg, index) => (
                    <Grid key={index} columns={12}>
                        <Grid.Col span={8}>
                            <Input
                            placeholder={`Argument ${index+1}`}
                            value={arg.value} 
                            onChange={(event) => updateArgument(index, event.currentTarget.value, arg.type)}
                            />
                        </Grid.Col>

                        <Grid.Col span={3}>
                            <NativeSelect
                            value={arg.type} 
                            onChange={(event) => updateArgument(index, arg.value, event.currentTarget.value)}
                            data={[
                                { label: 'String', value: 'z' },
                                { label: 'Wide String', value: 'Z' },
                                { label: 'Integer', value: 'i' },
                                { label: 'Short', value: 's' },
                                { label: 'Binary (b64)', value: 'b' },
                            ]} />
                        </Grid.Col>
                        
                        <Grid.Col span={1}>
                            <CloseButton size="lg" 
                            onClick={() => removeArgument(index)}
                            />
                        </Grid.Col>
                    </Grid>
                ))}
            </Stack>
            
            <Group grow>
                <Button color="gray" onClick={addArgument}>Add argument</Button>
            </Group>

            <Space h='xl' />

            {/* Submit button */}
            <Button 
                onClick={submit}
                leftSection={<FaTerminal />}
                loading={submitLoading}
                style={{width: '100%'}}
            >
                Execute
            </Button>
        </Modal>
    )
}

export default InlineExecuteModal