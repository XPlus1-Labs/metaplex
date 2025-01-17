import React from 'react';
import { Row, Col, Divider, Layout, Tag, Button, Skeleton, List, Card, Modal } from 'antd';
import { useParams, Link } from 'react-router-dom';
import { useArt, useExtendedArt } from './../../hooks';

import { ArtContent } from '../../components/ArtContent';
import { shortenAddress, useConnection } from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { MetaAvatar } from '../../components/MetaAvatar';
import { sendSignMetadata } from '../../actions/sendSignMetadata';
import { ViewOn } from './../../components/ViewOn';
import { ArtType } from '../../types';
import { useState } from 'react';

const { Content } = Layout;

export const ArtView = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const { id } = useParams<{ id: string }>();
  const wallet = useWallet();

  const connection = useConnection();
  const art = useArt(id);
  let badge = '';
  if (art.type === ArtType.NFT) {
    badge = 'Unique';
  } else if (art.type === ArtType.Master) {
    badge = 'NFT 0';
  } else if (art.type === ArtType.Print) {
    badge = `${art.edition} of ${art.supply}`;
  }
  const { ref, data } = useExtendedArt(id);

  // const { userAccounts } = useUserAccounts();

  // const accountByMint = userAccounts.reduce((prev, acc) => {
  //   prev.set(acc.info.mint.toBase58(), acc);
  //   return prev;
  // }, new Map<string, TokenAccount>());

  const description = data?.description;
  const attributes = data?.attributes;

  const pubkey = wallet.publicKey?.toBase58() || '';

  const tag = (
    <div className="info-header">
      <Tag color="blue">UNVERIFIED</Tag>
    </div>
  );

  const unverified = (
    <>
      {tag}
      <div style={{ fontSize: 12 }}>
        <i>
          This artwork is still missing verification from{' '}
          {art.creators?.filter(c => !c.verified).length} contributors before it
          can be considered verified and sellable on the platform.
        </i>
      </div>
      <br />
    </>
  );
  // console.log('data:', data)
  return (
    <Content>
      <Col>
        <Row ref={ref}>
          <Col xs={{ span: 24 }} md={{ span: 12 }} style={{ padding: '30px 30px 30px 0' }}>
            <div className="artwork-image-container">
              <ArtContent
                style={{ width: 300 }}
                height={300}
                width={300}
                className="artwork-image"
                pubkey={id}
                active={true}
                allowMeshRender={true}
              />
            </div>
            {data?.properties?.category === 'html' ?
              <>
                <div>
                  <Button style={{
                    marginTop: '20px',
                    width: '100%',
                    zIndex: 1
                  }} type="primary" onClick={showModal}>Preview</Button>
                </div>
                <Modal width="100%" title="Preview" visible={isModalVisible} onCancel={handleCancel} footer={null} centered>
                  <ArtContent
                    pubkey={id}
                    active={true}
                    allowMeshRender={true}
                    className="modal-iframe-preview"
                  />
                </Modal>
              </> : ''
            }
          </Col>
          {/* <Divider /> */}
          <Col
            xs={{ span: 24 }}
            md={{ span: 12 }}
            style={{ textAlign: 'left', fontSize: '1.4rem' }}
          >
            <Row>
              <h2 className="art-title">
                {art.title || <Skeleton paragraph={{ rows: 0 }} />}
              </h2>
            </Row>
            <Row>
              <Col span={6}>
                <h6>Royalties</h6>
                <div className="royalties">
                  {((art.seller_fee_basis_points || 0) / 100).toFixed(2)}%
                </div>
              </Col>
              <Col span={12}>
                <ViewOn id={id} />
              </Col>
            </Row>
            <Row>
              <Col>
                <h6 style={{ marginTop: 5 }}>Created By</h6>
                <div className="creators">
                  {(art.creators || []).map((creator, idx) => {
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 5,
                        }}
                      >
                        <MetaAvatar creators={[creator]} size={64} />
                        <Link to={`/artists/${creator.address}`} key={idx}>
                          <span className="creator-name">
                            {creator.name ||
                              shortenAddress(creator.address || '')}
                          </span>
                          <div style={{ marginLeft: 10 }}>
                            {!creator.verified &&
                              (creator.address === pubkey ? (
                                <Button
                                  onClick={async () => {
                                    try {
                                      await sendSignMetadata(
                                        connection,
                                        wallet,
                                        id,
                                      );
                                    } catch (e) {
                                      console.error(e);
                                      return false;
                                    }
                                    return true;
                                  }}
                                >
                                  Approve
                                </Button>
                              ) : (
                                tag
                              ))}
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
                <h6 style={{ marginTop: 5 }}>Edition</h6>
                <div className="art-edition">{badge}</div>
              </Col>
            </Row>

            {/* <Button
                  onClick={async () => {
                    if(!art.mint) {
                      return;
                    }
                    const mint = new PublicKey(art.mint);

                    const account = accountByMint.get(art.mint);
                    if(!account) {
                      return;
                    }

                    const owner = wallet.publicKey;

                    if(!owner) {
                      return;
                    }
                    const instructions: any[] = [];
                    await updateMetadata(undefined, undefined, true, mint, owner, instructions)

                    sendTransaction(connection, wallet, instructions, [], true);
                  }}
                >
                  Mark as Sold
                </Button> */}
          </Col>
          <Col span="12">
            <br />
            <Divider />
            {art.creators?.find(c => !c.verified) && unverified}
            <br />
            <div className="info-header">ABOUT THE CREATION</div>
            <div className="info-content">{description}</div>
            <br />
            {/*
              TODO: add info about artist


            <div className="info-header">ABOUT THE CREATOR</div>
            <div className="info-content">{art.about}</div> */}
          </Col>
          <Col span="12">
            {attributes &&
              <>
                <Divider />
                <br />
                <div className="info-header">Attributes</div>
                <List
                  size="large"
                  grid={{ column: 4 }}
                >
                  {attributes.map(attribute =>
                    <List.Item>
                      <Card title={attribute.trait_type}>{attribute.value}</Card>
                    </List.Item>
                  )}
                </List>
              </>
            }
          </Col>
        </Row>
      </Col>
    </Content>
  );
};
