
import {
    Mina,
    isReady,
    shutdown,
    Bool,
    UInt32,
    UInt64,
    Int64,
    Character,
    CircuitString,
    PrivateKey,
    PublicKey,
    Signature,
    Poseidon,
    Field,
    CircuitValue,
    prop,
    arrayProp,
    Circuit,
    MerkleWitness,
    MerkleTree,
    AccountUpdate
} from 'snarkyjs'

//   import { LedgerContract } from './LedgerContract.js'
import { BasicMerkleTreeContract , UserAccount} from './BasicMerkleTreeContract.js'

async function main() {
    await isReady;
    console.log("SnarkyJS loaded");

    // --------------------------------------

    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const deployerAccount = Local.testAccounts[0].privateKey;

    // --------------------------------------
    // create a new merkle tree and BasicMerkleTreeContract zkapp account 

    {

        const basicTreeZkAppPrivateKey = PrivateKey.random();
        const basicTreeZkAppAddress = basicTreeZkAppPrivateKey.toPublicKey();

        //   const height = 20;
        const height = 4; // 4 levels allows 8 leaf nodes in binary hash tree

        const tree = new MerkleTree(height);
        console.log(`New merkletree: ${JSON.stringify(tree)}`);
        class MerkleWitness20 extends MerkleWitness(height) { }

        const zkapp = new BasicMerkleTreeContract(basicTreeZkAppAddress);

        const deployTxn = await Mina.transaction(deployerAccount, () => {
            AccountUpdate.fundNewAccount(deployerAccount);
            zkapp.deploy({ zkappKey: basicTreeZkAppPrivateKey });
            zkapp.initState(tree.getRoot());
            zkapp.sign(basicTreeZkAppPrivateKey);
        });
        await deployTxn.send();
        // get initial state of BasicMerkleTreeContract after deployment
        const num0 = zkapp.treeRoot.get();
        console.log("State after init 'treeRoot':", num0.toString());

        // --------------------------------------
        // logs merkle tree info
        const treeHeight = tree.height;
        const treeNode = tree.getNode(
            0,
            BigInt(0),
        );
        const treeWitness0 = tree.getWitness(
            BigInt(0),
        );
        const treeWitness1 = tree.getWitness(
            BigInt(1),
        );
        const treeRoot = tree.getRoot();
        const leafCount = tree.leafCount;
        console.log(`BasicMerkleTree: treeHeight: ${treeHeight}`);
        console.log(`BasicMerkleTree: treeNode: ${treeNode}`);
        console.log(`BasicMerkleTree: treeWitness0: ${JSON.stringify(treeWitness0)}`);
        console.log(`BasicMerkleTree: treeWitness1: ${JSON.stringify(treeWitness1)}`);
        console.log(`BasicMerkleTree: treeRoot: ${treeRoot}`);
        console.log(`BasicMerkleTree: leafCount: ${leafCount}`);

        // --------------------------------------

        const incrementIndex = 0;
        const incrementAmount = Field(2);

        const witness = new MerkleWitness20(tree.getWitness(BigInt(incrementIndex)));
        tree.setLeaf(BigInt(incrementIndex), incrementAmount);

        const txn0 = await Mina.transaction(deployerAccount, () => {
            zkapp.update(
                witness,
                //   Field.zero,
                Field(0),
                incrementAmount);
            zkapp.sign(basicTreeZkAppPrivateKey);
        });
        await txn0.send();
        // --------------------------------------

        const incrementIndex1 = 1;
        const incrementAmount1 = Field(3);
        const witness1 = new MerkleWitness20(tree.getWitness(BigInt(incrementIndex1)));
        tree.setLeaf(BigInt(incrementIndex1), incrementAmount1);
        const txn1 = await Mina.transaction(deployerAccount, () => {
            zkapp.update(
                witness1,
                //   Field.zero,
                Field(0),
                incrementAmount1);
            zkapp.sign(basicTreeZkAppPrivateKey);
        });
        await txn1.send();
        // --------------------------------------

        console.log(`BasicMerkleTree: local tree root hash after txn0: ${tree.getRoot()}`);
        console.log(`BasicMerkleTree: smart contract root hash after txn0: ${zkapp.treeRoot.get()}`);

        // --------------------------------------

        // final tree 
        const finalTree = tree;
        console.log(`\nfinalTree: ${JSON.stringify(finalTree)}`);
        // check inclusion proof of leaf node 0
        const checkVal = 3 // value of leaf node 0
        const checkIndex = 1 // index of leaf node 0
        const checkWitness0 = new MerkleWitness20(tree.getWitness(BigInt(checkIndex)));
        const userAccount1 = new UserAccount(
            Field(checkVal),
        )
        const calculatedRoot = checkWitness0.calculateRoot(
            Field(checkVal),
        )
        console.log(`\ncalculatedRoot: ${calculatedRoot}`)
        const checkInclusion = zkapp.checkInclusion(
            userAccount1,
            checkWitness0,
        )
        

        console.log(`\ncheckInclusion: ${checkInclusion}`)
        // --------------------------------------
        // Get value from smart contract


        // mock user from front end 
        // value of 0 
    }




    await shutdown();
}


main();