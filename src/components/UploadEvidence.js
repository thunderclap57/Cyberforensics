import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseconfig';
import { Button, Container, Form, Modal, Spinner, Card } from 'react-bootstrap';
import { FaUpload, FaCheckCircle } from 'react-icons/fa';
import Web3 from 'web3';
import { useParams, Link, useNavigate } from 'react-router-dom';
import EvidenceChain from '../absi/EvidenceChain.json';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import './UploadEvidence.css';
import bg from "../assets/bg2.mp4";

const storage = new ThirdwebStorage({
    clientId: 'ca7a1235af205629113bde8bc1052466',
    secretKey: 'L3bnpo8jJXOqMgFiuUD4lj5GQKCYepKrZujsV2ZfM6ScBzdhe312ly9_V89-GL42Pq004AJRFLJ4RrdvHaHOlQ',
});

function UploadEvidence() {
    const { role } = useParams();
    const [user] = useAuthState(auth);
    const navigate = useNavigate();
    const [account, setAccount] = useState('');
    const [file, setFile] = useState(null);
    const [cid, setCid] = useState('');
    const [hash, setHash] = useState('');
    const [verificationCid, setVerificationCid] = useState('');
    const [evidenceStatus, setEvidenceStatus] = useState('');
    const [evidenceContract, setEvidenceContract] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState({ visible: false, title: '', message: '' });

    useEffect(() => {
        if (!user) {
            navigate('/');
        } else {
            loadWeb3();
            loadBlockchainData();
        }
    }, [user, navigate]);

    const loadWeb3 = async () => {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);
            } catch (error) {
                console.error('Error connecting to MetaMask:', error);
            }
        } else {
            alert('Non-Ethereum browser detected. Please install MetaMask!');
        }
    };

    const loadBlockchainData = async () => {
        try {
            const web3 = window.web3;
            const networkId = await web3.eth.net.getId();
            const networkData = EvidenceChain.networks[networkId];
            if (networkData) {
                const contract = new web3.eth.Contract(EvidenceChain.abi, networkData.address);
                setEvidenceContract(contract);
            } else {
                alert('Smart contract not deployed to detected network.');
            }
        } catch (error) {
            console.error('Error loading blockchain data:', error);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const uploadEvidence = async () => {
        if (file && evidenceContract) {
            setLoading(true);
            try {
                const uploadResult = await storage.upload(file);
                const uploadedCid = uploadResult.replace('ipfs://', '').split('/')[0];
                setCid(uploadedCid);
                const receipt = await evidenceContract.methods.uploadEvidence(uploadedCid).send({ from: account });
                setHash(receipt.transactionHash);
                setShowModal({
                    visible: true,
                    title: 'Upload Successful',
                    message: 'Evidence uploaded successfully!',
                });
            } catch (error) {
                console.error('Error uploading evidence:', error);
                setShowModal({
                    visible: true,
                    title: 'Upload Failed',
                    message: 'There was an error uploading the evidence.',
                });
            } finally {
                setLoading(false);
            }
        } else {
            alert('Please select a file and ensure the contract is loaded.');
        }
    };

    const verifyEvidence = async () => {
        if (evidenceContract && verificationCid) {
            setLoading(true);
            try {
                const storedCid = await evidenceContract.methods.getEvidence().call();
                if (storedCid === verificationCid) {
                    setEvidenceStatus('Evidence is NOT Altered!');
                    setShowModal({
                        visible: true,
                        title: 'Verification Successful',
                        message: 'Evidence is NOT Altered!',
                    });
                } else {
                    setEvidenceStatus('Evidence is Altered!');
                    setShowModal({
                        visible: true,
                        title: 'Verification Failed',
                        message: 'Evidence has been altered!',
                    });
                }
            } catch (error) {
                console.error('Error verifying evidence:', error);
                setShowModal({
                    visible: true,
                    title: 'Verification Failed',
                    message: 'Error verifying the evidence.',
                });
            } finally {
                setLoading(false);
            }
        } else {
            alert('Smart contract not loaded or CID not provided.');
        }
    };

    // Sign out method
    const handleSignOut = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="upload-evidence-container">
            {/* Video background */}
            <video autoPlay muted loop className="background-video">
                <source src={bg} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <Container className="content-container">
                <Card className="p-4 mb-4 bg-light">
                    <h2>Logged in as: {user ? user.email : 'Guest'}</h2>
                    <h3>Role: {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                    <h4>Account: {account}</h4>

                    {/* Sign Out Button */}
                    <Button variant="danger" className="mb-3" onClick={handleSignOut}>
                        Sign Out
                    </Button>

                    <Form.Group controlId="formFile" className="mt-3">
                        <Form.Label>Select evidence file to upload</Form.Label>
                        <Form.Control type="file" onChange={handleFileChange} />
                    </Form.Group>
                    <Button variant="primary" className="mt-3" onClick={uploadEvidence} disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : <FaUpload />} Upload Evidence
                    </Button>

                    <Form.Group controlId="formVerificationCid" className="mt-4">
                        <Form.Label>Enter CID for Verification</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter CID to verify"
                            value={verificationCid}
                            onChange={(e) => setVerificationCid(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="success" className="mt-3" onClick={verifyEvidence} disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : <FaCheckCircle />} Verify Evidence
                    </Button>
                </Card>

                {/* Modal for displaying messages */}
                <Modal show={showModal.visible} onHide={() => setShowModal({ ...showModal, visible: false })}>
                    <Modal.Header closeButton>
                        <Modal.Title>{showModal.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{showModal.message}</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal({ ...showModal, visible: false })}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
}

export default UploadEvidence;